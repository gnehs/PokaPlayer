module.exports = {
    apps: [{
        name: 'poka',
        script: './index.js',
        exec_mode: 'cluster',
        cron_restart: "* * */1 * *", //每日重啟
        autorestart: true,
        instances: 2,
        watch: false,
        max_memory_restart: '500M',
        error_file: 'NULL', // 錯誤 log 的指定位置
        out_file: 'NULL', // 輸出 log 的指定位置
        min_uptime: '20s',
        max_restarts: 10,
        restart_delay: 5000,
    }]
}