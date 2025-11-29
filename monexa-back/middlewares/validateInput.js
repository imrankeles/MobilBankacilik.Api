import Joi from "joi";

export const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz veri formatı",
      details: error.details.map((d) => d.message),
    });
  }
  next();
};
