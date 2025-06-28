import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupForm from './components/signup';
import ChildrenPassword from './components/childsignup';
import ChildHomePage from './components/home';
import ParentLogin from './components/login';
import ChildrenLogin from './components/childlogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupForm />} />
        <Route path='/children-page' element={<ChildrenPassword />}/>
        <Route path="/home" element={<ChildHomePage />} />
        <Route path='/parent-login' element={<ParentLogin />}/>
        <Route path='/children-login' element={<ChildrenLogin />}/>
        
        {/* <Route path="/chat" element={<ChatPage />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/profile" element={<ProfilePage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
