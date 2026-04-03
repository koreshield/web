import sys

filepath = '/opt/koreshield/.env'
with open(filepath, 'r') as f:
    content = f.read()

# Comment out old azure endpoint
content = content.replace('AZURE_OPENAI_ENDPOINT=https://koreshieldai.openai.azure.com/', '# AZURE_OPENAI_ENDPOINT=https://koreshieldai.openai.azure.com/')

# Check if new azure endpoint exists
new_azure = 'AZURE_OPENAI_ENDPOINT=https://koreshieldai.cognitiveservices.azure.com/'
if new_azure not in content:
    content += f'\n{new_azure}'

# Check if deepseek exists
deepseek = 'DEEPSEEK_API_KEY=sk-55ae86001cfa486eb5d783e8cfe17cca'
if deepseek not in content:
    content += f'\n{deepseek}\n'

with open(filepath, 'w') as f:
    f.write(content)
