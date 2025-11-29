const bcrypt = require("bcryptjs");

module.exports = {
    // Parolayı hash’ler
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    },

    // Parolanın doğru olup olmadığını kontrol eder
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
};
