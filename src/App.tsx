import { AnalysisProvider } from './context/AnalysisContext';
import { Header } from './components/UI/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { GoogleMapView } from './components/Map/GoogleMapView';

export default function App() {
  return (
    <AnalysisProvider>
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800 lg:h-screen lg:overflow-hidden">
        <Header />
        <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
          <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:h-full lg:w-[380px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <Sidebar />
          </aside>
          <main className="relative h-[75vh] w-full lg:h-full lg:flex-1">
            <GoogleMapView />
          </main>
        </div>
      </div>
    </AnalysisProvider>
  );
}