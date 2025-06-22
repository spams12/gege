import { useRouter } from 'next/router';

export default function GoHomeButton() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <button
      type="button"
      onClick={handleGoHome}
      className="mt-8 block mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    >
      العودة للصفحة الرئيسية
    </button>
  );
}