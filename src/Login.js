import React, { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setName("");
    setEmail("");
    setPassword("");
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  const loginWithEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  const registerWithEmail = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-green-300 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-2xl font-bold text-center">
            {isRegistering ? "Register" : "Login"}
          </h2>

          {isRegistering && (
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button className="w-full" onClick={isRegistering ? registerWithEmail : loginWithEmail}>
            {isRegistering ? "Register" : "Login"}
          </Button>

          <Button variant="outline" className="w-full" onClick={googleSignIn}>
            Continue with Google
          </Button>

          <p
            onClick={toggleMode}
            className="text-center text-sm text-blue-600 hover:underline cursor-pointer"
          >
            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
