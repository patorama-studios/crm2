const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const uploadController = {
  async uploadFiles(req, res) {
    try {
      const { job_id } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const [[job]] = await db.query(
        'SELECT assigned_creator_id, assigned_editor_id FROM jobs WHERE id = ?',
        [job_id]
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

      const uploadPromises = files.map(file => {
        const fileType = file.mimetype.startsWith('image/') ? 'photo' : 
                        file.mimetype.startsWith('video/') ? 'video' : 'other';
        
        return db.execute(
          `INSERT INTO uploads (job_id, uploaded_by_user_id, file_type, file_url, file_name, file_size)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [job_id, req.user.id, fileType, file.path, file.originalname, file.size]
        );
      });

      await Promise.all(uploadPromises);

      await db.execute(
        `INSERT INTO notifications (user_id, job_id, message, type)
         SELECT created_by_user_id, ?, ?, ?
         FROM jobs WHERE id = ?`,
        [job_id, `New files uploaded by ${req.user.name}`, 'upload', job_id]
      );

      res.status(201).json({ 
        message: 'Files uploaded successfully',
        uploadedFiles: files.length 
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  },

  async getUploads(req, res) {
    try {
      const { job_id } = req.params;

      const [uploads] = await db.query(
        `SELECT u.*, usr.name as uploaded_by_name
         FROM uploads u
         JOIN users usr ON u.uploaded_by_user_id = usr.id
         WHERE u.job_id = ?
         ORDER BY u.created_at DESC`,
        [job_id]
      );

      res.json(uploads);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      res.status(500).json({ error: 'Failed to fetch uploads' });
    }
  },

  async markAsFinal(req, res) {
    try {
      const { id } = req.params;
      const { is_final } = req.body;

      const [[upload]] = await db.query(
        'SELECT job_id, uploaded_by_user_id FROM uploads WHERE id = ?',
        [id]
      );

      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      if (req.user.role !== 'super_admin' && 
          req.user.role !== 'team_manager' && 
          upload.uploaded_by_user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await db.execute(
        'UPDATE uploads SET is_final = ? WHERE id = ?',
        [is_final, id]
      );

      res.json({ message: 'Upload status updated successfully' });
    } catch (error) {
      console.error('Error updating upload:', error);
      res.status(500).json({ error: 'Failed to update upload' });
    }
  },

  async deleteUpload(req, res) {
    try {
      const { id } = req.params;

      const [[upload]] = await db.query(
        'SELECT file_url, uploaded_by_user_id FROM uploads WHERE id = ?',
        [id]
      );

      if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      if (req.user.role !== 'super_admin' && upload.uploaded_by_user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await fs.unlink(upload.file_url).catch(err => {
        console.error('Error deleting file:', err);
      });

      await db.execute('DELETE FROM uploads WHERE id = ?', [id]);

      res.json({ message: 'Upload deleted successfully' });
    } catch (error) {
      console.error('Error deleting upload:', error);
      res.status(500).json({ error: 'Failed to delete upload' });
    }
  }
};

module.exports = uploadController;