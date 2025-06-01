import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../styles/SharePasswordForm.css';

export default function SharePasswordForm({ onShareSuccess, onClose, item, requestMasterPassword }) {
  const [receiverUsername, setReceiverUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('SharePasswordForm: Form submitted', { itemId: item._id, receiverUsername });
    if (isSubmitting) return;

    if (!receiverUsername) {
      toast.error('Please enter a username.');
      return;
    }
    if (receiverUsername === item.username) {
      toast.error('You cannot share a password with yourself.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('SharePasswordForm: Initiating share request');
      const initiateRes = await requestMasterPassword((masterPassword) => {
        console.log('SharePasswordForm: Sending initiate request with master password');
        return axios.post(
          `/api/shares/initiate/${item._id}`,
          { receiverUsername },
          {
            headers: { 'x-master-key': masterPassword },
            withCredentials: true
          }
        );
      });
      if (!initiateRes) throw new Error('Master password required to initiate share.');

      const { shareId } = initiateRes.data;
      console.log('SharePasswordForm: Share initiated, shareId:', shareId);

      console.log('SharePasswordForm: Providing data for share');
      const provideRes = await requestMasterPassword((masterPassword) => {
        console.log('SharePasswordForm: Sending provide-data request with master password');
        return axios.post(
          `/api/shares/provide-data/${shareId}`,
          {},
          {
            headers: { 'x-master-key': masterPassword },
            withCredentials: true
          }
        );
      });
      if (!provideRes) throw new Error('Master password required to provide share data.');

      console.log('SharePasswordForm: Share data provided, shareId:', provideRes.data.shareId);
      onShareSuccess({ 
        item, 
        receiverUsername, 
        shareId: provideRes.data.shareId 
      });
    } catch (error) {
      console.error('SharePasswordForm: Error during share process', error);
      const message = error.response?.data?.message || 'Failed to share item';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="share-form-overlay">
      <div className="share-form-modal">
        <h3>🔐 Share Password for: <i>{item.domain}</i></h3>
        <form onSubmit={handleSubmit}>
          <label>
            Recipient Username:
            <input
              type="text"
              value={receiverUsername}
              onChange={(e) => setReceiverUsername(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </label>
          <div className="share-form-buttons">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sharing...' : 'Share'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                console.log('SharePasswordForm: Form closed');
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// import { useState } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';
// import '../styles/SharePasswordForm.css';

// export default function SharePasswordForm({ onShareSuccess, onClose, item, requestMasterPassword }) {
//   const [receiverUsername, setReceiverUsername] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (isSubmitting) return;

//     if (!receiverUsername) {
//       toast.error('Please enter a username.');
//       return;
//     }
//     if (receiverUsername === item.username) {
//       toast.error('You cannot share a password with yourself.');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const initiateConfig = {
//         method: 'post',
//         url: `/api/shares/initiate/${item._id}`,
//         data: { receiverUsername },
//         withCredentials: true
//       };
//       let res = await requestMasterPassword(async () => {
//         const config = { ...initiateConfig, headers: { 'x-master-key': await promptMasterPassword() } };
//         return await axios(config);
//       });
//       if (!res) throw new Error('Master password required to initiate share.');

//       const { shareId } = res.data;
//       // Chain to provide-data step
//       const provideConfig = {
//         method: 'post',
//         url: `/api/shares/provide-data/${shareId}`,
//         data: {},
//         withCredentials: true
//       };
//       res = await requestMasterPassword(async () => {
//         const config = { ...provideConfig, headers: { 'x-master-key': await promptMasterPassword() } };
//         return await axios(config);
//       });
//       if (!res) throw new Error('Master password required to provide share data.');

//       onShareSuccess({ 
//         item, 
//         receiverUsername, 
//         shareId: res.data.shareId 
//       });
//     } catch (error) {
//       const message = error.response?.data?.message || 'Failed to share item';
//       toast.error(message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const promptMasterPassword = async () => {
//     return new Promise((resolve) => {
//       requestMasterPassword((masterPassword) => {
//         resolve(masterPassword);
//       });
//     });
//   };

//   return (
//     <div className="share-form-overlay">
//       <div className="share-form-modal">
//         <h3>🔐 Share Password for: <i>{item.domain}</i></h3>
//         <form onSubmit={handleSubmit}>
//           <label>
//             Recipient Username:
//             <input
//               type="text"
//               value={receiverUsername}
//               onChange={(e) => setReceiverUsername(e.target.value)}
//               required
//               disabled={isSubmitting}
//             />
//           </label>
//           <div className="share-form-buttons">
//             <button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? 'Sharing...' : 'Share'}
//             </button>
//             <button 
//               type="button" 
//               onClick={onClose}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }