const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const env = require('./env.js');

const app = express();
const PORT = 80;

// 跨域配置（允许本地和公网访问）
app.use(cors({
  origin: [
    'http://localhost:80',
    'http://n8c9d43f.natappfree.cc' // 替换为你的natapp公网域名
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// 解析JSON和表单请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（前端页面放在public文件夹）
app.use(express.static(path.join(__dirname, 'public')));

// 数据库配置
const dbConfig = {
  host: env.DB_HOST.trim(),
  port: env.DB_PORT.trim(),
  user: env.DB_USER.trim(),
  password: env.DB_PASSWORD ? env.DB_PASSWORD.trim() : '',
  database: env.DB_NAME.trim(),
  connectTimeout: 10000 // 超时时间
};

// 创建数据库连接
const connection = mysql.createConnection(dbConfig);
connection.connect((err) => {
  if (err) {
    console.error('❌ 数据库连接失败：', err.message);
    console.error('连接参数：', dbConfig);
    console.error('请检查MySQL是否启动，配置是否正确');
    return;
  }
  console.log('✅ 数据库连接成功');
  initTable(); // 初始化表单表
});

// 初始化表单数据表格（适配MySQL 8.0.11版本，保留nickname唯一约束）
function initTable() {
  // 1. 先检查表单表是否存在
  const checkTableSql = `
    SELECT COUNT(*) AS table_count 
    FROM information_schema.tables 
    WHERE table_schema = ? AND table_name = 'form_data'
  `;

  connection.query(checkTableSql, [dbConfig.database], (checkErr, results) => {
    if (checkErr) {
      console.error('❌ 检查表存在性失败：', checkErr.message);
      return;
    }

    const tableExists = results[0].table_count > 0;

    if (!tableExists) {
      // 2. 表不存在，创建包含password字段和nickname唯一约束的新表
      const createTableSql = `
        CREATE TABLE form_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nickname VARCHAR(50) NOT NULL UNIQUE, -- 昵称唯一约束
          password VARCHAR(100) NOT NULL,
          gender VARCHAR(20) NOT NULL,
          hobby TEXT NOT NULL,
          superpower VARCHAR(50) NOT NULL,
          fortune TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;

      connection.query(createTableSql, (createErr) => {
        if (createErr) {
          console.error('❌ 创建新表失败：', createErr.message);
        } else {
          console.log('✅ 新表创建成功，已包含password字段和nickname唯一约束');
        }
      });
    } else {
      // 3. 表存在，检查是否包含password字段
      const checkColumnSql = `
        SELECT COUNT(*) AS column_count 
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'form_data' AND column_name = 'password'
      `;

      connection.query(checkColumnSql, [dbConfig.database], (columnErr, columnResults) => {
        if (columnErr) {
          console.error('❌ 检查字段存在性失败：', columnErr.message);
          return;
        }

        const columnExists = columnResults[0].column_count > 0;

        if (!columnExists) {
          // 字段不存在，删除旧表并重建（包含password和nickname唯一约束）
          console.log('⚠️ 检测到表缺少password字段，正在重建表结构...');
          const dropTableSql = 'DROP TABLE form_data';
          
          connection.query(dropTableSql, (dropErr) => {
            if (dropErr) {
              console.error('❌ 删除旧表失败：', dropErr.message);
              return;
            }

            // 重建包含password字段和nickname唯一约束的表
            const recreateTableSql = `
              CREATE TABLE form_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nickname VARCHAR(50) NOT NULL UNIQUE, -- 昵称唯一约束
                password VARCHAR(100) NOT NULL,
                gender VARCHAR(20) NOT NULL,
                hobby TEXT NOT NULL,
                superpower VARCHAR(50) NOT NULL,
                fortune TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;

            connection.query(recreateTableSql, (recreateErr) => {
              if (recreateErr) {
                console.error('❌ 重建表失败：', recreateErr.message);
              } else {
                console.log('✅ 表结构重建成功，已添加password字段和nickname唯一约束');
              }
            });
          });
        } else {
          console.log('✅ 表结构正常，已包含password字段和nickname唯一约束');
        }
      });
    }
  });
}

// 表单提交接口
app.post('/submit-form', (req, res) => {
  const { nickname, pwd, gender, hobby, superpower, fortune } = req.body;

  // 前端字段二次验证（防止绕过前端）
  const errors = [];
  if (!nickname?.trim()) errors.push('请输入昵称');
  if (!pwd || pwd.length < 6) errors.push('密码至少6位');
  if (!gender) errors.push('请选择性别');
  if (!hobby || !Array.isArray(hobby) || hobby.length === 0) errors.push('请选择至少一项爱好');
  if (!superpower) errors.push('请选择超能力');
  if (!fortune) errors.push('请抽取今日运势');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join('；') });
  }

  // 检查昵称是否已存在
  const checkNicknameSql = 'SELECT COUNT(*) AS count FROM form_data WHERE nickname = ?';
  connection.query(checkNicknameSql, [nickname], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('❌ 检查昵称重复失败：', checkErr.message);
      return res.status(500).json({ success: false, message: '服务器查询昵称失败' });
    }

    // 昵称已存在 → 返回明确提示
    if (checkResults[0].count > 0) {
      console.log(`⚠️ 昵称 ${nickname} 已存在，返回400错误`);
      return res.status(400).json({ 
        success: false, 
        message: '用户名重复，请重新取名' 
      });
    }

    // 昵称不存在 → 插入数据
    const insertSql = `
      INSERT INTO form_data (nickname, password, gender, hobby, superpower, fortune)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const hobbyStr = Array.isArray(hobby) ? JSON.stringify(hobby) : hobby; // 兼容数组格式
    const values = [nickname, pwd, gender, hobbyStr, superpower, fortune];

    connection.query(insertSql, values, (insertErr, result) => {
      if (insertErr) {
        console.error('❌ 插入数据失败：', insertErr.message);
        return res.status(500).json({ success: false, message: '服务器保存数据失败' });
      }
      console.log(`✅ 昵称 ${nickname} 提交成功，ID: ${result.insertId}`);
      res.json({ success: true, message: '表单提交成功！', data: { id: result.insertId } });
    });
  });
});

// 根路径重定向到前端页面
app.get('/', (req, res) => {
  res.redirect('/learning.html');
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`🌐 公网访问：http://n8c9d43f.natappfree.cc/learning.html`); // 替换为你的natapp域名
  console.log(`🌐 本地访问：http://localhost/learning.html`);
});