import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import Appointment from '../models/Appointments';
import File from '../models/File';
import User from '../models/User';
import Notification from '../schema/Notification';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

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
    if (provider_id === req.userId){
      return res.status(406).json({ error: 'não pode criar um compromisso para você mesmo' })
    }

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true  },
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

    /**
     * Notificar prestador de serviço
     */
    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', as' H:mm'h'",
      {locale: pt}
      )

    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res){
    const appointment = await Appointment.findByPk(req.params.id);

    if (appointment.user_id !== req.userId){
      return res.status(401).json({
        error: "você não tem permissão de cancelar esse compromisso",
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())){
      return res.status(401).json({
        error: 'você pode cancelar com 2 horas de antecedencia',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    return res.json(appointment);
  }
}

export default new AppointmentController();
