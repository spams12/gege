import { Html, Head, Main, NextScript, DocumentProps } from 'next/document';

export default function Document(props: DocumentProps) {
  const currentLocale = props.locale || 'ar';
  const direction = currentLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <Html lang={currentLocale} dir={direction}>
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}