+++
title = "Installs & Configs"
chapter = false
weight = 20
+++

Before we begin coding, there are a few things we need to install, update, and configure in the Cloud9 environment.

### Installing and updating

In the Cloud9 terminal, **run the following commands** to install and update some software we'll be using for this workshop:

```bash
# Update the AWS CLI
pip install --user --upgrade awscli

# Install the AWS Amplify CLI
npm install -g @aws-amplify/cli@4.13.2

# Install jq
sudo yum install jq -y
```

{{% notice note %}}
These commands will take a few minutes to finish.
{{% /notice %}}

### Configuring a default region 

A best practice is to deploy your infrastructure close to your customers, let's configure a default AWS region for this workshop : Northern Virginia (*us-east-1*) for North America or Ireland (*eu-west-1*) for Europe.

**Create an AWS config file**, run:

{{% tabs %}}
{{% tab "us-east-1" "Virginia" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=us-east-1
END
```
{{% /tab %}}

{{% tab "us-west-2" "Oregon" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=us-west-2
END
```
{{% /tab %}}

{{% tab "eu-west-1" "Ireland" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=eu-west-1
END
```
{{% /tab %}}

{{% tab  "ap-southeast-1"  "Singapore" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=ap-southeast-1
END
```
{{% /tab %}}
{{% /tabs %}}

{{% notice info %}}
The AWS Amplify CLI is a toolchain which includes a robust feature set for simplifying mobile and web application development. The step above took care of installing it, but we also need to configure it. It needs to know what region to work with, and it determines this by looking for the *~/.aws/config* file. Cloud9 takes care of making sure we have valid Administrator credentials in the *~/.aws/credentials* file, but it doesn't create *~/.aws/config* for us.
{{% /notice %}}