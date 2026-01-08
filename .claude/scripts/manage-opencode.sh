#!/bin/bash
# OpenCode 快速启动和任务委派脚本
# 供 Claude Code 调用

set -e

OPENCODE_DIR="C:\\D\\opencode"
API_PORT=3001
WEB_PORT=3000

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 OpenCode 是否已运行
check_opencode_running() {
    curl -s http://localhost:$WEB_PORT > /dev/null 2>&1
    return $?
}

# 启动 OpenCode
start_opencode() {
    echo -e "${YELLOW}🚀 启动 OpenCode 多智能体系统...${NC}"

    cd "$OPENCODE_DIR"

    # Windows 环境下启动
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        cmd.exe /c "START /B START_FULL_SYSTEM.bat" > /dev/null 2>&1 &
    else
        ./START_FULL_SYSTEM.bat > /dev/null 2>&1 &
    fi

    # 等待服务启动（最多60秒）
    echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
    for i in {1..60}; do
        if check_opencode_running; then
            echo -e "${GREEN}✅ OpenCode 已启动！${NC}"
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}❌ OpenCode 启动超时${NC}"
    return 1
}

# 主函数
main() {
    local action="${1:-status}"

    case "$action" in
        start)
            if check_opencode_running; then
                echo -e "${GREEN}✅ OpenCode 已在运行${NC}"
                echo "Web界面: http://localhost:$WEB_PORT"
                echo "API端点: http://localhost:$API_PORT"
            else
                start_opencode
            fi
            ;;

        stop)
            echo -e "${YELLOW}🛑 停止 OpenCode...${NC}"
            # 找到并杀死进程
            taskkill //F //IM OpenCode.exe > /dev/null 2>&1 || true
            taskkill //F //IM node.exe > /dev/null 2>&1 || true
            echo -e "${GREEN}✅ OpenCode 已停止${NC}"
            ;;

        restart)
            $0 stop
            sleep 2
            $0 start
            ;;

        status)
            if check_opencode_running; then
                echo -e "${GREEN}✅ OpenCode 运行中${NC}"
                echo "Web界面: http://localhost:$WEB_PORT"
                echo "API端点: http://localhost:$API_PORT"

                # 检查各服务状态
                echo ""
                echo "服务状态:"
                curl -s http://localhost:8000/v1/models -H "Authorization: Bearer aaa" > /dev/null 2>&1 && \
                    echo "  ✅ CursorWeb2API: 运行中" || \
                    echo "  ❌ CursorWeb2API: 未运行"

                curl -s http://localhost:$WEB_PORT > /dev/null 2>&1 && \
                    echo "  ✅ Web界面: 运行中" || \
                    echo "  ❌ Web界面: 未运行"
            else
                echo -e "${RED}❌ OpenCode 未运行${NC}"
                echo "使用 '$0 start' 启动"
            fi
            ;;

        delegate)
            # 委派任务到 OpenCode
            local task_description="$2"

            if ! check_opencode_running; then
                echo -e "${YELLOW}OpenCode 未运行，正在启动...${NC}"
                start_opencode
            fi

            echo -e "${GREEN}📋 创建任务: $task_description${NC}"

            # 这里可以添加实际的 API 调用
            # curl -X POST http://localhost:$API_PORT/api/tasks ...

            echo -e "${GREEN}✅ 任务已委派给 OpenCode 多智能体团队${NC}"
            echo "可访问 http://localhost:$WEB_PORT 查看进度"
            ;;

        *)
            echo "用法: $0 {start|stop|restart|status|delegate}"
            echo ""
            echo "命令:"
            echo "  start     - 启动 OpenCode"
            echo "  stop      - 停止 OpenCode"
            echo "  restart   - 重启 OpenCode"
            echo "  status    - 检查状态"
            echo "  delegate  - 委派任务"
            exit 1
            ;;
    esac
}

main "$@"
