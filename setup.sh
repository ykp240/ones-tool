#!/bin/bash

# ONES 工时填报应用 - 安装脚本
# 此脚本用于修复 npm 缓存权限问题并安装依赖

echo "正在修复 npm 缓存权限..."
sudo chown -R $(whoami) "$HOME/.npm"

echo "正在清理 npm 缓存..."
npm cache clean --force

echo "正在安装项目依赖..."
npm install --legacy-peer-deps

echo "安装完成！"
echo "运行 'npm run dev' 启动开发服务器"
