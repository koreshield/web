---
title: Six AI and Software Security Incidents in One Week - What Nobody Is Saying
excerpt: Three of six recent security incidents were LLM-layer attacks. Most engineering teams have no runtime protection between their applications and models. Here's why that matters.
date: 2026-03-31
author: Teslim O. Kazeem
categories: Security, Updates
tags: ai security, llm security, prompt injection, devsecops, koreshield, incidents
status: published
readingTime: 2
---

This week in AI and software security:

- **LiteLLM** shipped a backdoored release that was actively exfiltrating secrets.
- **Axios** got hit with supply chain malware through a compromised dependency.
- **Railway** had a CDN caching misconfiguration leaking user data across accounts.
- **OpenAI Codex** was vulnerable to command injection through GitHub branch names.
- **Mercor**, a hiring platform, leaked 1TB of candidate data.
- **Delve** exposed sensitive user information and created live compliance risk.

Six incidents in one week.

## The Uncomfortable Truth

Now here is the part nobody is saying out loud:

**Three of those six are LLM-layer attacks.** Injection. Exfiltration. Manipulation through inputs nobody was inspecting.

And the uncomfortable truth is that most engineering teams shipping AI products today have no runtime layer sitting between their application and their model provider. No request inspection. No response filtering. No policy enforcement. Nothing.

You have a CI/CD pipeline. You've got WAF, and probably a SIEM.

**However, you do not have an LLM firewall.**

We spent three decades hardening every other layer of the stack. Then the fastest-moving, most manipulable component in the history of software got bolted on at the top, and we called it shipped.

## Why This Matters

The incidents are not bad luck, but predictable outcome of deploying without defence.

Koreshield is a runtime enforcement proxy that sits between your application and your LLM provider, inspecting every request and response before it completes.

- One URL change to integrate
- Under 50ms latency overhead
- Zero-log by default

It's the firewall every LLM deployment is missing.

If you are building with LLMs in production, or you know someone who is, this is the conversation that needs to happen now.

[Get started with koreshield.com today.](https://koreshield.com/)
