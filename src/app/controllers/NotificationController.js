import User from '../models/User';
import Notification from '../schema/Notification';

class NotificationController {
  async index(req, res){
    const checkIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkIsProvider) {
      return res.status(401).json({
        error: 'Somente prestadores de serviço pode carregar as notificações',
      });
    }

    const notifications = await Notification.find({
      user: req.userId,
    })
    .sort({ createdsAt: 'desc' })
    .limit(20);

    return res.json(notifications);
  }
}

export default new NotificationController();
