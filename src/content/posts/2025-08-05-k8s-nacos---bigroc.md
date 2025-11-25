---
title: "k8s nacos 集群部署流程 - bigroc"
date: 2025-08-05T07:35:00.000Z
slug: k8s-nacos---bigroc
categories: []
tags: []
summary: "一、核心配置解析 Headless Service (nacos-headless) 类型为 ClusterIP: None，用于为 StatefulSet 提供稳定的 DNS 记录（如 nacos-0.nacos-headless.default.svc.cluster.local）。 暴露 4 个端口： 8848：Nacos 客户端访问端口 9848/9849：Nacos 2.0+ 的 gRP..."
originUrl: "https://www.cnblogs.com/bigroc/p/19023257"
---

# 一、核心配置解析

1.  Headless Service (`nacos-headless`)
    
    *   类型为 `ClusterIP: None`，用于为 StatefulSet 提供稳定的 DNS 记录（如 `nacos-0.nacos-headless.default.svc.cluster.local`）。
    *   暴露 4 个端口：
        *   `8848`：Nacos 客户端访问端口
        *   `9848/9849`：Nacos 2.0+ 的 gRPC 通信端口
        *   `7848`：兼容 1.4.x 版本的选举端口
2.  ConfigMap (`nacos-cm`)
    
    *   存储 MySQL 数据库配置（地址、库名、凭据等），供 StatefulSet 通过环境变量引用。
    *   注意：需提前确保 MySQL 服务可用，且数据库 `nacos_devtest` 已初始化（建议执行 Nacos 的 MySQL 初始化脚本）。
3.  StatefulSet (`nacos`)
    
    *   副本数：3 个 Pod，通过 `podAntiAffinity` 确保分散在不同节点（提升高可用性）。
    *   资源请求：每个 Pod 请求 2GB 内存和 0.5 CPU。
    *   环境变量：
        *   `NACOS_SERVERS` 明确指定集群节点地址（必须与 Headless Service 的 DNS 格式匹配）。
        *   `PREFER_HOST_MODE: hostname` 确保节点以主机名注册到集群。

* * *

# 二、Rancher 操作步骤

1.  创建 ConfigMap

*   进入目标集群的 `ConfigMaps` 页面，点击 `Create`。
*   名称填写 `nacos-cm`，将 `data` 部分粘贴到 YAML 编辑器（或通过表单填写 MySQL 配置）。
*   验证：确保键值对与配置一致，尤其是密码等敏感信息。

2.  创建 Headless Service

*   进入 `Services` 页面，点击 `Create` 选择 `ClusterIP` 类型。
*   关键配置：
    *   名称：`nacos-headless`
    *   标签：`app: nacos-headless`
    *   `ClusterIP` 设置为 `None`
    *   端口按配置添加（8848、9848、9849、7848）

3.  部署 StatefulSet

*   进入 `Workloads` → `StatefulSets`，点击 `Create`。
*   基础配置：
    *   名称：`nacos`
    *   副本数：3
    *   服务名称：`nacos-headless`（必须与 Service 名称一致）
*   Pod 模板：
    *   标签：`app: nacos`
    *   容器镜像：`nacos/nacos-server:latest`
    *   资源限制：按需调整（示例中为 `requests`，可补充 `limits`）
    *   端口映射：与配置中的 `containerPort` 一致
    *   环境变量：从 ConfigMap 引用的键需与 `nacos-cm` 中定义匹配
*   调度规则：
    *   在 `Advanced Options` 中配置 `Pod Affinity`，选择 `Required` 反亲和性，按 `hostname` 分散 Pod。

4.  验证部署

*   检查 Pod：确保 3 个 Pod 状态为 `Running`，且分布在不同节点。
*   日志检查：
    
    ```bash
    kubectl logs nacos-0 | grep "Cluster is healthy"
    ```
    
    确认日志中无 `选举失败` 或 `连接拒绝` 错误。
*   DNS 解析测试：
    
    ```bash
    kubectl exec -it nacos-0 -- curl nacos-1.nacos-headless:8848/nacos/v1/ns/operator/metrics
    ```
    

* * *

# 三、常见问题与调优建议

1.  MySQL 连接问题
    
    *   若出现数据库连接失败，检查：
        *   MySQL 服务是否允许集群内访问。
        *   ConfigMap 中的密码是否含特殊字符（需转义）。
    *   建议：在 MySQL 中为 Nacos 创建专用用户并限制权限。
2.  集群启动顺序
    
    *   StatefulSet Pod 按顺序启动（nacos-0 → nacos-1 → nacos-2），首次启动需等待 nacos-0 完全就绪。
    *   可增加 `initialDelaySeconds` 和 `livenessProbe` 避免健康检查过早失败。
3.  资源不足
    
    *   若 Pod 频繁重启，需调整 `resources.limits`（例如内存设为 `4Gi`）。
    *   监控工具建议：通过 Rancher 的 `Monitoring` 查看 Pod 资源使用率。
4.  版本兼容性
    
    *   若从 Nacos 1.4.x 升级，需保留 `7848` 端口；纯 2.0+ 环境可移除该端口。

* * *

四、扩展配置（可选）

*   持久化存储：  
    在 StatefulSet 中添加 `volumeClaimTemplates`，为每个 Pod 绑定 PVC（如使用 Rancher 的 Local Path Provisioner）。
*   Ingress 配置：  
    通过 Rancher 的 `Ingress` 将 Nacos 控制台（8848 端口）暴露给外部访问，需配置域名和 TLS。

通过以上步骤，可在 Rancher 中快速部署高可用的 Nacos 集群。部署后建议通过 Nacos 控制台（`http://<Pod-IP>:8848/nacos`）验证节点列表和配置管理功能。