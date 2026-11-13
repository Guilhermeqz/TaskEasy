# CA publica do Supabase

`supabase-prod-ca-2021.crt` foi baixado por HTTPS de:

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

E um certificado publico, sem chave privada. O driver utiliza esta CA somente para hosts `*.pooler.supabase.com`, mantendo a verificacao do certificado e do nome do servidor. Para outros provedores, utiliza as CAs padrao do Node, ou a CA fornecida explicitamente em `DATABASE_CA_CERT`.

Se o provedor renovar a CA, obtenha a versao correspondente em **Database > Settings > SSL Configuration > Download Certificate** e atualize o certificado. Nao desative a verificacao TLS.

Referencia: https://supabase.com/docs/guides/platform/ssl-enforcement
