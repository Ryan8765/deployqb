const keytar = require('keytar');

module.exports = {
    /**
     * Stores pw in secure OS vault.
     * @param {String} pw Password to be used
     * @param {String} service Service to be used to store pw
     * @param {String} account Account to be used to store pw
     * @return {Promise} Returns keytar promise.
     */
    setPW: (pw, service, account) => {
        if (!service || !account) {
            return false;
        }
        return keytar.setPassword(service, account, pw);
    },

    /**
     * Gets pw from secure OS vault.
     * @param {String} pw Password to be used
     * @param {String} service Service to be used to store pw
     * @param {String} account Account to be used to store pw
     * @return {Promise} Returns keytar promise.
     */
    getPW: (service, account) => {
        if( !service || !account ) {
            return false;
        }
        return keytar.getPassword(service, account);
    }

};







