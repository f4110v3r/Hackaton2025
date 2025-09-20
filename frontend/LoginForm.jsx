import PageWrapper from "./PageWrapper";
import {Login} from './Login'
import {BackgroundVideo1} from './BackgroundVideo1'
export default function LoginForm() {
  


  return (
    <PageWrapper>
    <div style={{
     position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  overflow: 'hidden',
  zIndex: 1,
  fontFamily: '-apple-system, BlinkMacSystemFont, "San Francisco", Arial, sans-serif'
    }}>
      {/* Видео на фоне */}
      <BackgroundVideo1 />
      
      <Login />
      {/* Затемнённый слой для читаемости */}
      
    </div>
    </PageWrapper>
  );
} 