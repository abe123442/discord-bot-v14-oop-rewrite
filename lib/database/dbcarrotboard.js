const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs   = require('fs');
//const { count, table } = require('console');


// Class for the carrotboard db
class DBcarrotboard {

    constructor(){
        //Loads the db configuration
        var details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        })
        // The name of the table
        var table_name = 'CARROT_BOARD';
        
        // Creates the table if it doesn't exists
        (async () => {
            var is_check = await this.check_table(table_name);
            //console.log(is_check);
            if(is_check == false) {
                await this.create_table();
            }   
            
          })();
        

    }

    load_db_login() {
    // Get document, or throw exception on error
        try {
        const doc = yaml.load(fs.readFileSync('./config/database.yml'));
        return doc;
        } catch (e) {
        console.log(e);
        }
    }

    // Checks if the table exists in the db
    async check_table(table_name) {
        const client = await this.pool.connect()
        try{
        //console.log("Running check_table command")
        await client.query("BEGIN");
        const values = [table_name]
        var result = await client.query("select * from information_schema.tables where table_name=$1",values)
        await client.query("COMMIT");
        
        if(result.rowCount == 0) {
            return false;
        }
        else {
            return true;
        }

        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //// console.log("Client released successfully.")    
        }
    }
    
    // Creates a new table
    async create_table() {
        const client = await this.pool.connect()
        try{
        console.log("Running create_table")
        await client.query("BEGIN");
        var query = `CREATE TABLE CB_CHANNELS(
                CHANNEL_ID BIGINT PRIMARY KEY, 
                SERVER_ID BIGINT NOT NULL,
                EMOJI CHAR(40) NOT NULL
            );
            
            CREATE TABLE CB_MESSAGES(
                CARROT_ID SERIAL PRIMARY KEY,
                MESSAGE_ID BIGINT NOT NULL,
                USER_ID BIGINT NOT NULL,
                COUNT BIGINT,
                MESSAGE_CONTENTS CHAR(50),
                CHANNEL_ID BIGINT NOT NULL,
                FOREIGN KEY (CHANNEL_ID) REFERENCES CB_CHANNELS (CHANNEL_ID)
            );`;

        var result = await client.query(query)
        await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    async count_values(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try{
        // console.log("Connected successfully.")
        //
        await client.query("BEGIN");

        var query = `SELECT COUNT(*) FROM CB_CHANNELS 
            JOIN CB_MESSAGES ON CB_CHANNELS.CHANNEL_ID = CB_MESSAGE.CHANNEL_ID
            where emoji = $1 and message_id = $2 and user_id = $3 
            and CB_CHANNELS.channel_id = $4`;

        var values = [emoji, message_id, user_id, channel_id]
        var result = await client.query(query, values)
        await client.query("COMMIT");

            
        return result['rows'][0]['count'];
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    async get_count(emoji,message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try{
        //console.log("Connected successfully.")
        //
        await client.query("BEGIN");

        var query = `SELECT * FROM CB_CHANNELS 
        JOIN CB_MESSAGES ON CB_CHANNELS.CHANNEL_ID = CB_MESSAGE.CHANNEL_ID
        where emoji = $1 and message_id = $2 and user_id = $3 
        and CB_CHANNELS.channel_id = $4`;

        var values = [emoji, message_id, user_id, channel_id]
        var result = await client.query(query, values)
        await client.query("COMMIT");

            
        
        return result.rows[0].count;
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    async add_value(emoji, server_id, message_id, user_id, channel_id,message_contents) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");
            var count_val = await this.count_values(emoji,message_id, user_id, channel_id)
            //console.log(count_val)

            if(count_val == 0) {
                var query = `INSERT INTO CB_CHANNELS (CHANNEL_ID, SERVER_ID, EMOJI) VALUES ($1,$2,$3)`;
                var values = [channel_id, server_id, emoji];
                var result = await client.query(query, values);

                var query = `INSERT INTO CB_MESSAGES (MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT, MESSAGE_CONTENTS) VALUES ($1,$2,$3,$4,$5)`;
                var values = [message_id, user_id, channel_id,1, message_contents]
                
                var result = await client.query(query, values);
                await client.query("COMMIT");
            } 
            else {
                var count = await this.get_count(emoji, message_id, user_id, channel_id);
                count = Number(count) + 1;
                var query = `UPDATE CB_MESSAGES SET count = $1  where emoji = $2 and message_id = $3 and user_id = $4 and channel_id = $5`;
                var values = [count,emoji, message_id, user_id, channel_id]
                
                var result = await client.query(query, values)
                await client.query("COMMIT");
            }
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    async get_by_cb_id(cb_id) {
        const client = await this.pool.connect()
        try{
        //console.log("Connected successfully.")
        //
        await client.query("BEGIN");

        var query = `SELECT * from CB_MESSAGES where carrot_id = $1`;

        var values = [cb_id]
        var result = await client.query(query, values)
        await client.query("COMMIT");
        
            
        if (result.rowCount == 0) {
            return null;   
        }
        return {
            'carrot_id':result.rows[0]['carrot_id'],
            'emoji':result.rows[0]['emoji'].trim(),
            'message_id':result.rows[0]['message_id'],
            'user_id':result.rows[0]['user_id'],
            'channel_id':result.rows[0]['channel_id'],
            'count':result.rows[0]['count'],
            'message_contents': result.rows[0]['message_contents'].trim()
            };
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    // TODO: fix this???
    async get_by_msg_emoji(message_id, emoji) {
        const client = await this.pool.connect()
        try{
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `SELECT * from CB_MESSAGES where message_id = $1 and emoji = $2`;

            var values = [message_id];
            var result = await client.query(query, values);
            await client.query("COMMIT");
            
            if (result.rowCount == 0) {
                        return null;   
                }
            return {
                'carrot_id':result.rows[0]['carrot_id'],
                'emoji':result.rows[0]['emoji'].trim(),
                'message_id':result.rows[0]['message_id'],
                'user_id':result.rows[0]['user_id'],
                'channel_id':result.rows[0]['channel_id'],
                'count':result.rows[0]['count'],
                'message_contents': result.rows[0]['message_contents'].trim()
            };
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }
 
    async get_all(channel_id, count_min) {
        const client = await this.pool.connect()
        try{
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `SELECT * from CB_MESSAGES where count >= $1 and channel_id = $2`;

            var values = [count_min, channel_id];
            var result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async del_entry(message_id, channel_id) {
        const client = await this.pool.connect()
        try{
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `DELETE FROM CB_MESSAGES where message_id = $1 and channel_id = $2`;

            var values = [message_id, channel_id];
            var result = await client.query(query, values);
            await client.query("COMMIT");

        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async del_entry_emoji(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try{
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `DELETE FROM CB_MESSAGES where message_id = $1 and channel_id = $2  and user_id = $3`;

            var values = [message_id, channel_id, user_id, emoji];
            var result = await client.query(query, values);
            await client.query("COMMIT");

        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }
    
    async sub_value(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try{
            var count = await this.get_count(emoji, message_id, user_id, channel_id)
            
            if((count - 1) <= 0) {
                this.del_entry_emoji(emoji, message_id, user_id, channel_id)
            }
            else {
                // console.log("Connected successfully.")
                await client.query("BEGIN");
    
                count = count - 1;
                var query = `UPDATE CB_MESSAGES SET count = $1  where message_id = $3 and user_id = $4 and channel_id = $5`;
    
                var values = [count, emoji, message_id, user_id, channel_id];
                var result = await client.query(query, values);
                await client.query("COMMIT");
    
            }


        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async get_all_by_user(channel_id, count_min, user) {
        const client = await this.pool.connect()
        try{
            // console.log("Connected successfully.")
            await client.query("BEGIN");


            var query = `SELECT * from CB_MESSAGES where channel_id = $1 and count >= $2 and user_id = $3 ORDER BY count DESC`;

            var values = [channel_id, count_min, user];
            var result = await client.query(query, values);
            await client.query("COMMIT");
            

            return result.rows;


        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }
}

module.exports = {
    DBcarrotboard,
};


//Anonymous function for testing purposes
/*
(async () => {
    var db = new DBcarrotboard();    
    //console.log(user)
})();

*/
