import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ChatScreen } from '../src/screens';

export default function ChatTab() {
  const [visit, setVisit] = useState(0);
  useFocusEffect(useCallback(() => { setVisit(value => value + 1); }, []));
  return <ChatScreen visit={visit} />;
}
