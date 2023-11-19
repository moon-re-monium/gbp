const fs = require('fs');
const readline = require('readline');
const puppeteer = require('puppeteer');
const { error } = require('console');

// 質問用
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// バイナリデータからパスワードを生成する関数
function fromeBinary(binaryData) {
    // シーザー暗号のキー
    const key = 3;

    // バイナリデータを16進数の文字列に変換と置き換え
    const hexString = binaryData.toString('hex').replace(/00/g, '+').replace(/04/g, '/');
    
    // シーザー暗号で文字列を暗号化し、先頭から15文字を取り出す
    const encryptedCode = caesaKey(hexString, key);
    return encryptedCode.slice(0, 15); // 最大文字数
}

// シーザー暗号でテキストを暗号化する関数
function caesaKey(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        let charCode = text.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
            result += String.fromCharCode((charCode - 65 + key) % 26 + 65);
        } else if (charCode >= 97 && charCode <= 122) {
            result += String.fromCharCode((charCode - 97 + key) % 26 + 97);
        } else {
            result += text[i];
        }
    }
    return result;
}

// URLからスクリーンショットを取得し、バイナリデータを返す関数
async function screenshotTake(urlToScreenshot, domain) {
    // スクリーンショット保存用のディレクトリが存在しなければ作成
    const screenshotsDir = './screenshots';
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
        console.log('[screenshots]フォルダ作成済み');
    }

    // Puppeteerを使用してブラウザを起動
    const browser = await puppeteer.launch({ headless: "new" });
    // 新しいページを作成
    const page = await browser.newPage();
    // ビューポートの設定
    await page.setViewport({ width: 1920, height: 1080 });
    // 指定したURLに移動
    await page.goto(urlToScreenshot);

    // スクリーンショットの保存先パス
    const screenshotPath = `${screenshotsDir}/${domain}.png`;
    // ページをスクリーンショットとして保存
    await page.screenshot({ path: screenshotPath });

    // ブラウザを閉じる
    await browser.close();

    // スクリーンショットをバイナリデータに変換
    const binaryData = fs.readFileSync(screenshotPath);
    
    return binaryData;
}

// メイン関数
async function main() {
    try {
        console.log('1 ----- スクリーンショットとパスワード生成');
        console.log('2 ----- パスワード生成のみ');
        
        // モードの選択
        const mode = await new Promise((resolve) => {
            rl.question('(1/2): ', (answer) => {
                resolve(answer);
            });
        });

        // モード分岐
        if (mode === '1' || mode === '2') {
            let url;
            if (mode === '1') {
                // 対象のURLを取得
                url = await new Promise((resolve) => {
                    rl.question('スクリーンショット用URL: ', (answer) => {
                        resolve(answer);
                    });
                });
            } else {
                // 画像のパスを取得
                url = await new Promise((resolve) => {
                    rl.question('画像のパス: ', (answer) => {
                        resolve(answer);
                    });
                });
            }

            // URLからドメインを抽出
            const domain = extractDomain(url);

            // file:// ローカルファイルアクセス
            const urlToScreenshot = url.startsWith('http') ? url : `file://${__dirname}/${url}`;
            
            // スクリーンショットを取得し、パスワードを生成
            const binaryData = await screenshotTake(urlToScreenshot, domain);
            const password = fromeBinary(binaryData);
            console.log('========================================================');
            console.log('生成されたパスワード:', password);
            console.log('========================================================');
            await fs.unlink('screenshots/null.png', (error) =>{});
        } else {
            console.log('無効');
        }
    } catch (error) {
        console.error('無効', error);
    } finally {
        // 入力欄閉じる
        rl.close();
    }
}

// URLからドメインを抽出する関数
function extractDomain(url) {
    const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
        return match[2];
    } else {
        return null;
    }
}


main();
