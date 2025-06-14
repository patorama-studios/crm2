const db = require('../config/database');
const { validationResult } = require('express-validator');

const jobController = {
  async createJob(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        customer_id,
        address,
        date,
        time,
        assigned_creator_id,
        assigned_editor_id,
        notes,
        products
      } = req.body;

      const [jobResult] = await connection.execute(
        `INSERT INTO jobs (customer_id, address, date, time, assigned_creator_id, 
         assigned_editor_id, notes, created_by_user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, address, date, time, assigned_creator_id, 
         assigned_editor_id, notes, req.user.id]
      );

      const jobId = jobResult.insertId;

      if (products && products.length > 0) {
        for (const product of products) {
          await connection.execute(
            `INSERT INTO job_products (job_id, product_id, variant_id, payout_amount, price, duration)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [jobId, product.product_id, product.variant_id, 
             product.payout_amount, product.price, product.duration]
          );
        }
      }

      if (assigned_creator_id) {
        await connection.execute(
          `INSERT INTO notifications (user_id, job_id, message, type)
           VALUES (?, ?, ?, ?)`,
          [assigned_creator_id, jobId, 'You have been assigned to a new job', 'assignment']
        );
      }

      await connection.commit();
      
      res.status(201).json({ 
        message: 'Job created successfully', 
        jobId 
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    } finally {
      connection.release();
    }
  },

  async getJobs(req, res) {
    try {
      const { status, date_from, date_to, customer_id, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT j.*, c.agency_name, c.contact_name,
               u1.name as creator_name, u2.name as editor_name
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN users u1 ON j.assigned_creator_id = u1.id
        LEFT JOIN users u2 ON j.assigned_editor_id = u2.id
        WHERE 1=1
      `;
      
      const params = [];

      if (req.user.role === 'content_creator') {
        query += ' AND j.assigned_creator_id = ?';
        params.push(req.user.id);
      } else if (req.user.role === 'editor') {
        query += ' AND j.assigned_editor_id = ?';
        params.push(req.user.id);
      }

      if (status) {
        query += ' AND j.status = ?';
        params.push(status);
      }
      
      if (date_from) {
        query += ' AND j.date >= ?';
        params.push(date_from);
      }
      
      if (date_to) {
        query += ' AND j.date <= ?';
        params.push(date_to);
      }
      
      if (customer_id) {
        query += ' AND j.customer_id = ?';
        params.push(customer_id);
      }

      query += ' ORDER BY j.date DESC, j.time DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [jobs] = await db.query(query, params);

      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) as total FROM jobs WHERE 1=1' + 
        (req.user.role === 'content_creator' ? ' AND assigned_creator_id = ?' : '') +
        (req.user.role === 'editor' ? ' AND assigned_editor_id = ?' : ''),
        req.user.role === 'content_creator' || req.user.role === 'editor' ? [req.user.id] : []
      );

      res.json({
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  },

  async getJobById(req, res) {
    try {
      const { id } = req.params;
      
      const [[job]] = await db.query(
        `SELECT j.*, c.agency_name, c.contact_name, c.email as customer_email,
                u1.name as creator_name, u2.name as editor_name, u3.name as created_by_name
         FROM jobs j
         LEFT JOIN customers c ON j.customer_id = c.id
         LEFT JOIN users u1 ON j.assigned_creator_id = u1.id
         LEFT JOIN users u2 ON j.assigned_editor_id = u2.id
         LEFT JOIN users u3 ON j.created_by_user_id = u3.id
         WHERE j.id = ?`,
        [id]
      );

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (req.user.role === 'content_creator' && job.assigned_creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (req.user.role === 'editor' && job.assigned_editor_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const [products] = await db.query(
        `SELECT jp.*, p.title, pv.name as variant_name
         FROM job_products jp
         JOIN products p ON jp.product_id = p.id
         LEFT JOIN product_variants pv ON jp.variant_id = pv.id
         WHERE jp.job_id = ?`,
        [id]
      );

      const [uploads] = await db.query(
        `SELECT u.*, usr.name as uploaded_by_name
         FROM uploads u
         JOIN users usr ON u.uploaded_by_user_id = usr.id
         WHERE u.job_id = ?
         ORDER BY u.created_at DESC`,
        [id]
      );

      job.products = products;
      job.uploads = uploads;

      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  },

  async updateJob(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;
    
    try {
      const allowedUpdates = ['address', 'date', 'time', 'status', 
                            'assigned_creator_id', 'assigned_editor_id', 'notes'];
      
      const updateFields = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .map(key => `${key} = ?`);
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const values = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .map(key => updates[key]);
      
      values.push(id);

      const [result] = await db.execute(
        `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (updates.status || updates.assigned_creator_id || updates.assigned_editor_id) {
        const [[job]] = await db.query(
          'SELECT customer_id, assigned_creator_id, assigned_editor_id FROM jobs WHERE id = ?',
          [id]
        );

        const notificationPromises = [];

        if (updates.status) {
          if (job.assigned_creator_id) {
            notificationPromises.push(
              db.execute(
                'INSERT INTO notifications (user_id, job_id, message, type) VALUES (?, ?, ?, ?)',
                [job.assigned_creator_id, id, `Job status updated to ${updates.status}`, 'update']
              )
            );
          }
        }

        if (updates.assigned_creator_id && updates.assigned_creator_id !== job.assigned_creator_id) {
          notificationPromises.push(
            db.execute(
              'INSERT INTO notifications (user_id, job_id, message, type) VALUES (?, ?, ?, ?)',
              [updates.assigned_creator_id, id, 'You have been assigned to a job', 'assignment']
            )
          );
        }

        await Promise.all(notificationPromises);
      }

      res.json({ message: 'Job updated successfully' });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  },

  async deleteJob(req, res) {
    const { id } = req.params;
    
    try {
      const [result] = await db.execute('DELETE FROM jobs WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  }
};

module.exports = jobController;