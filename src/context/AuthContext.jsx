import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { auth, onAuthStateChanged, signOut, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, doc, setDoc, serverTimestamp, db } from "../firebase/index.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || user.email || 'Anonymous',
            lastActive: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.error("Failed to update user activity in Firestore:", err);
        }
      }
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    toast.success("Logged out successfully!");
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        loading,
        login,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);





