const fastCsv = require('fast-csv');
const {createConnection} = require('mysql2/promise');
const {createWriteStream} = require('fs');

exports.makeCSV =  function(fileName, data) {
    return new Promise((resolve, reject) => {
        try {
            const outputStream = createWriteStream(fileName);
            fastCsv
                .write(data, { headers: true })
                .pipe(outputStream)
                .on("finish", resolve);
        } catch (e) {
            reject(e);
        }
    });
}

exports.getInstances = async function(host, user, password) {
    const con = await createConnection({ host, user, password });
    const [instances] = await con.query("SELECT DISTINCT(database_name), id, domain, description, server, status FROM common.tbl_sys_instance WHERE status != -1");
    return [con, instances];
}
