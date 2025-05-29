import { useContext } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { user } = useContext(UserContext);
    
}