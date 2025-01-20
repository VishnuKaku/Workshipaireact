import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import { LogIn } from "lucide-react";

const LoginForm: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://4durbmip8r.eu-central-1.awsapprunner.com/api/auth/login', { username, password });
            console.log(response.data.message);
            localStorage.setItem('token', response.data.token);
            toast({
                title: "Success!",
                description: "You have been logged in.",
            });
            navigate("/home");
        } catch (error: any) {
            console.error('Login failed:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Invalid credentials",
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="auth-card w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="form-container">
                        <div className="input-container">
                            <label htmlFor="username">Username</label>
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full"
                                id="username"
                            />
                        </div>
                        <div className="input-container">
                            <label htmlFor="password">Password</label>
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full"
                                id="password"
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                        </Button>
                        <Link to="/signup">Create an account</Link>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginForm;