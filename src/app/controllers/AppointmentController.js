import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import Appointment from '../models/Appointments';
import User from '../models/User';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'erro de validação' });
    }

    const { provider_id, date } = req.body;

    /**
     * verificar se o provider_id é um prestador de serviço
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    const hourStart = startOfHour(parseISO(date));

    // Verificando datas passadas
    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'datas passadas não são permitidas' });
    }

    if (!isProvider) {
      return res.status(401).json({
        error: 'você pode apenas criar compromissos sem prestadores de serviço',
      });
    }

    // verificar datas disponiveis
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res.status(400).json({ error: 'data não disponivel' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
