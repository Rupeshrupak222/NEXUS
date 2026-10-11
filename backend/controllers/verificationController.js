import { certificateService } from '../services/certificateService.js';

export const verificationController = {
  async verifyCertificate(req, res, next) {
    try {
      const { certificateNumber } = req.params;
      const result = await certificateService.verifyCertificate(certificateNumber);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
