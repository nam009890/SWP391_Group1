param([switch]$Frontend)
$ErrorActionPreference='Stop'
$qaRoot=Split-Path -Parent $PSScriptRoot
$qaDirectory=Join-Path $qaRoot '.qa-local'
if($Frontend) {
    $env:VITE_API_URL='http://127.0.0.1:8097/api'
    Push-Location (Join-Path $qaRoot 'frontend')
    try { & node node_modules/vite/bin/vite.js --host=127.0.0.1 --port=5187 --strictPort }
    finally { Pop-Location }
    exit $LASTEXITCODE
}
# Isolated H2 only. No connection to SQL Server and no static demo password in source.
New-Item -ItemType Directory -Force -Path $qaDirectory | Out-Null
$qaSecret='Qa9'+[guid]::NewGuid().ToString()
@{password=$qaSecret}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $qaDirectory 'credentials.json')
$env:DEMO_ADMIN_PASSWORD=$qaSecret
$env:DEMO_LEARNER_PASSWORD=$qaSecret
$env:DEMO_LOCKED_PASSWORD=$qaSecret
$env:DEMO_SEED_ENABLED='true'
$env:AI_PROVIDER='demo-library'
& mvn -f (Join-Path $qaRoot 'spring-boot-app/pom.xml') spring-boot:run `
    '-Dspring-boot.run.useTestClasspath=true' '-Dspring-boot.run.profiles=demo' `
    '-Dspring-boot.run.jvmArguments=-Dspring.devtools.restart.enabled=false' `
    '-Dspring-boot.run.arguments=--server.port=8097 --spring.datasource.url=jdbc:h2:mem:browserqa;MODE=MSSQLServer;DB_CLOSE_DELAY=-1 --spring.datasource.driverClassName=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.database-platform=org.hibernate.dialect.H2Dialect --spring.jpa.hibernate.ddl-auto=create-drop --spring.jpa.show-sql=false --app.cors.allowed-origins=http://127.0.0.1:5187'
exit $LASTEXITCODE
