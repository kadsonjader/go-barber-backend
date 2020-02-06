import Appointment from '../models/Appointments';
import User from '../models/User';
import * as Yup from 'yup';

class AppointmentController{
  async store(req, res){
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'erro de validação' })
    }

    const { provider_id, date } = req.body;

    /**
     * verificar se o provider_id é um prestador de serviço
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider){
      return res
      .status(401)
      .json({ error: 'você pode apenas criar compromissos sem prestadores de serviço' });
    }
    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    return res.json();
  }
}

export default new AppointmentController();
