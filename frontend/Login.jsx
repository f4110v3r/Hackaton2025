import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";


export const Login=()=>{

  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

 const handleSign = (e) => {
  //e.preventDefault();
    navigate("/signin");
  };
  const handleSubmit = (e) => {
  e.preventDefault();
  if (login === "Serega" && password === "1234") {
    navigate("/dashboard");
  } else {
    alert(`Неверный логин или пароль`);
  }
};

    return(
      
              <form className="login-form" >
                <h2 className="login-title">Log in</h2>
        
                <input
                  type="text"
                  placeholder="Login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="login-input"
                />
        
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
        
                <button type="button" onClick={handleSubmit} className="login-button">
                  Log in
                </button>
                <button type="button" onClick={handleSign} className="login-signin">
                  Sign in
                </button>
              </form>
          
            


    );
}