import React from 'react';
import { AppProvider } from './src/appContext';
import { PlanScreen } from './src/screens';
// Expo Router owns the runtime entry; this component supports isolated rendering.
export default function App() { return <AppProvider><PlanScreen /></AppProvider>; }
