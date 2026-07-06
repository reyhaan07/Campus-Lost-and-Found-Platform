import Joi from 'joi';

const sanitizeText = (value) => value.trim();

export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().required(),
    password: Joi.string().min(6).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  req.body.name = sanitizeText(value.name);
  req.body.email = value.email.toLowerCase();
  req.body.phone = sanitizeText(value.phone);
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  req.body.email = value.email.toLowerCase();
  next();
};

export const validateReport = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().trim().required(),
    category: Joi.string().valid('Electronics', 'Documents', 'Accessories', 'Clothing', 'Others').required(),
    description: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    date: Joi.date().max('now').required(),
    type: Joi.string().valid('lost', 'found').required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  req.body.title = sanitizeText(value.title);
  req.body.description = sanitizeText(value.description);
  req.body.location = sanitizeText(value.location);
  req.body.date = value.date;
  req.body.category = value.category;
  req.body.type = value.type;
  next();
};

export const validateReportUpdate = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().trim(),
    category: Joi.string().valid('Electronics', 'Documents', 'Accessories', 'Clothing', 'Others'),
    description: Joi.string().trim(),
    location: Joi.string().trim(),
    date: Joi.date().max('now'),
  }).min(1);

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  req.body = value;
  next();
};

export const validateProfileUpdate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim(),
    phone: Joi.string().trim(),
    password: Joi.string().min(6),
  }).min(1);

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  req.body = value;
  next();
};
