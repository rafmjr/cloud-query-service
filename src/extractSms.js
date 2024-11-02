const { getInstances, makeCSV } = require('./utils');

const getQuery = (db, startDate, endDate) => `
	SELECT
		id,
		type,
		unit,
		log_id,
		time,
		idmasteraccount,
		datetime,
		user_id,
		guid_to,
		JSON_EXTRACT(data, '$.numbers') numbers,
		JSON_EXTRACT(data, '$.message') message,
		JSON_UNQUOTE(JSON_EXTRACT(data, '$.sid')) sid,
		JSON_UNQUOTE(JSON_EXTRACT(data, '$.accountSid')) accountSid,
		JSON_UNQUOTE(JSON_EXTRACT(data, '$.messagingServiceSid')) messagingServiceSid
	FROM ${db}.tbl_sys_usage_log
    WHERE
		time >= UNIX_TIMESTAMP('${startDate}')
		AND time < UNIX_TIMESTAMP('${endDate}')
		AND type = 'SMS.OUT'
`;

module.exports = async function(host, username, password) {
	try {
		const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];
		const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

		const [con, instances] = await getInstances(host, username, password);
		for (const instance of instances) {
			try {
				if (!instance.database_name) {
					console.log(`Error: empty database name!`, instance);
					continue;
				}

				const filePath = `/tmp/${instance.domain}.csv`

				console.log(`Fetching data for ${instance.domain}: ${instance.database_name}`);
				const query = getQuery(instance.database_name, startDate, endDate);
				const [results] = await con.query(query);

				if (results.length === 0) {
					console.log(`No data found for ${instance.domain}`);
					continue;
				}

				await makeCSV(filePath, results);
			} catch (e) {
				console.log(e);
			}
		}

		con.end();
	} catch (e) {
		console.log(`Error: could not fetch instances!`, e);
	}

	console.log("Finished!");
	process.exit();
}
