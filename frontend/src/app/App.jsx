import React, { useEffect } from 'react';
import AppRouter from '../router/AppRouter';
import { applyPrintSettings, getEffectivePrintSettings } from '../utils/printStyles';

function App() {
  useEffect(() => {
    applyPrintSettings(getEffectivePrintSettings());
  }, []);

  return <AppRouter />;
}

export default App;
