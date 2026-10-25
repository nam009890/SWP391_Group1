$ErrorActionPreference = 'Stop'
$config = Join-Path $PSScriptRoot '../spring-boot-app/src/main/resources/application.properties'
$variables = @{
    'spring.datasource.password' = 'DB_PASSWORD'
    'spring.security.oauth2.client.registration.google.client-id' = 'SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID'
    'spring.security.oauth2.client.registration.google.client-secret' = 'SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET'
    'app.ai.api-key' = 'AI_API_KEY'
    'app.ai.openai.api-key' = 'OPENAI_API_KEY'
    'app.ai.gemini.api-key' = 'GEMINI_API_KEY'
    'app.jwt.secret' = 'JWT_SECRET'
    'jwt.secret' = 'JWT_SECRET'
}
$lines = foreach ($line in [IO.File]::ReadAllLines($config)) {
    if ($line -match '^\s*([^#!\s][^=]*?)\s*=') {
        $key = $matches[1].Trim()
        if ($variables.ContainsKey($key)) {
            $key + '=${' + $variables[$key] + ':}'
        } else { $line }
    } else { $line }
}
[IO.File]::WriteAllLines($config, [string[]]$lines, [Text.UTF8Encoding]::new($false))
Write-Output 'Credential properties replaced with environment placeholders. Review the Git diff before pushing.'
