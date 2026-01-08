/**
 * AI 模型切换使用示例 (Node.js)
 * 支持本地 cursorweb2api 的 24 个模型
 */

const axios = require('axios');

class MultiModelAI {
    constructor(baseURL = 'http://localhost:8000/v1', apiKey = 'aaa') {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
    }

    /**
     * 调用指定模型进行对话
     * @param {string} model - 模型ID
     * @param {string} message - 用户消息
     * @param {Object} options - 其他参数
     */
    async chat(model, message, options = {}) {
        const data = {
            model,
            messages: [{ role: 'user', content: message }],
            ...options
        };

        try {
            const response = await this.client.post('/chat/completions', data);
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error(`错误 [${model}]:`, error.message);
            return null;
        }
    }

    /**
     * 列出所有可用模型
     */
    async listModels() {
        try {
            const response = await this.client.get('/models');
            return response.data.data.map(m => m.id);
        } catch (error) {
            console.error('获取模型列表失败:', error.message);
            return [];
        }
    }

    /**
     * 流式对话（实时输出）
     */
    async chatStream(model, message, onChunk) {
        const data = {
            model,
            messages: [{ role: 'user', content: message }],
            stream: true
        };

        try {
            const response = await this.client.post('/chat/completions', data, {
                responseType: 'stream'
            });

            response.data.on('data', chunk => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const json = line.slice(6);
                        if (json !== '[DONE]') {
                            try {
                                const parsed = JSON.parse(json);
                                const content = parsed.choices[0]?.delta?.content;
                                if (content) onChunk(content);
                            } catch (e) {}
                        }
                    }
                }
            });
        } catch (error) {
            console.error('流式请求失败:', error.message);
        }
    }
}

// 使用示例
async function main() {
    const ai = new MultiModelAI();

    console.log('📋 可用模型:');
    const models = await ai.listModels();
    models.forEach((model, i) => {
        console.log(`  ${i + 1}. ${model}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试不同模型
    const testModels = [
        { id: 'claude-4.5-sonnet', name: 'Claude 4.5 Sonnet' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'deepseek-r1', name: 'DeepSeek R1' }
    ];

    const question = '什么是递归？用一句话解释。';

    console.log(`❓ 问题: "${question}"\n`);

    for (const { id, name } of testModels) {
        console.log(`🤖 ${name}:`);
        const answer = await ai.chat(id, question, { max_tokens: 100 });
        console.log(`   ${answer}\n`);
    }

    // 编程任务示例
    console.log('='.repeat(50));
    console.log('💻 编程任务测试\n');

    const codeQuestion = '写一个JavaScript函数，计算数组的平均值';
    console.log(`❓ ${codeQuestion}\n`);

    console.log('🤖 Code Supernova:');
    const codeAnswer = await ai.chat('code-supernova-1-million', codeQuestion, { max_tokens: 500 });
    console.log(codeAnswer);
}

// 交互式切换示例
async function interactiveMode() {
    const ai = new MultiModelAI();
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🎯 交互式 AI 模型切换');
    console.log('命令: /model <模型名> - 切换模型');
    console.log('命令: /list - 列出所有模型');
    console.log('命令: /exit - 退出\n');

    let currentModel = 'claude-4.5-sonnet';
    console.log(`当前模型: ${currentModel}\n`);

    const askQuestion = () => {
        rl.question('You: ', async (input) => {
            input = input.trim();

            if (input === '/exit') {
                console.log('再见！');
                rl.close();
                return;
            }

            if (input === '/list') {
                const models = await ai.listModels();
                console.log('\n📋 可用模型:');
                models.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
                console.log();
                askQuestion();
                return;
            }

            if (input.startsWith('/model ')) {
                currentModel = input.slice(7);
                console.log(`✅ 已切换到: ${currentModel}\n`);
                askQuestion();
                return;
            }

            console.log(`🤖 ${currentModel}:`);
            const answer = await ai.chat(currentModel, input);
            console.log(`   ${answer}\n`);

            askQuestion();
        });
    };

    askQuestion();
}

// 运行示例
if (require.main === module) {
    // main(); // 批量测试
    interactiveMode(); // 交互式模式
}

module.exports = MultiModelAI;
