const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 读取 manifest.json 获取版本号
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const version = manifest.version;

// 创建输出目录
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// 输出文件名
const outputFile = path.join(distDir, `anytable-v${version}.zip`);

// 创建写入流
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
    zlib: { level: 9 } // 最高压缩级别
});

output.on('close', () => {
    console.log(`✓ 打包完成: ${outputFile}`);
    console.log(`✓ 文件大小: ${(archive.pointer() / 1024).toFixed(2)} KB`);
});

archive.on('error', (err) => {
    throw err;
});

// 连接输出流
archive.pipe(output);

// 添加文件
console.log('开始打包...');

// 添加单个文件
archive.file('manifest.json', { name: 'manifest.json' });
archive.file('popup.html', { name: 'popup.html' });
archive.file('popup.js', { name: 'popup.js' });
archive.file('README.md', { name: 'README.md' });
archive.file('LICENSE', { name: 'LICENSE' });

// 添加目录
archive.directory('icons/', 'icons');
archive.directory('src/', 'src');

// 完成打包
archive.finalize();
