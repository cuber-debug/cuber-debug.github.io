/**
 * 数据库配置文件
 * 说明：数据库为本地MySQL（路径：D:\MYSQL\mysql-8.0.11-winx64\my.ini），无需修改配置
 * 所有表单数据将提交到本地该数据库，公网访问仅通过域名转发请求，不改变数据库连接方式
 */
module.exports = {
    DB_HOST: '127.0.0.1',    // 本地数据库IP（固定）
    DB_PORT: '3306',         // MySQL默认端口（固定）
    DB_USER: 'root',         // 数据库用户名（根据实际情况调整，默认root）
    DB_PASSWORD: '123456',   // 数据库密码（请替换为你的实际MySQL密码）
    DB_NAME: 'my_form_db'    // 表单数据存储的数据库名（已在server.js中初始化表）
};