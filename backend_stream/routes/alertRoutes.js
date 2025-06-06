import { Router } from 'express';
import Alert from '../models/Alert.js';

const router = Router();

// Mark alert as read
router.put('/:alertId/read', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      { isRead: true },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Dismiss alert
router.put('/:alertId/dismiss', async (req, res) => {
  try {
    const { note } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      {
        isResolved: true,
        resolvedAt: new Date(),
        $push: {
          actions: {
            type: 'dismissed',
            note: note || 'Dismissed by user',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

export default router;