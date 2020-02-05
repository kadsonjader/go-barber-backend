import User from '../models/User';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res
        .status(400)
        .json({ error: 'usuario já existe na base de dados' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res){
    const { email, oldPassword } = req.body;

    const user =  await User.findByPk(req.userId);

      if(email && email != user.email){
        const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'usuario já existe na base de dados' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(400).json({ error: 'A senha antiga nao concide com a base de dados' });
    }

    const { id, name, provider } = await user.update(req.body);

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();
