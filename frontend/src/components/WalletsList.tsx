import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import {useEffect, useState} from "react";

const rows = [
  {name: 'wallet1', description: 'Description 1', balance: 100},
  {name: 'wallet2', description: 'Description 2', balance: 3000},
  {name: 'wallet3', description: 'Description 3', balance: 5000},
];
const WalletsList = () => {
  const [addWalletModal, setAddWalletModal] = useState(false);
  const openModal = () => {
    console.log('add new wallet');
    setAddWalletModal(true);
  };

  const closeModal = () => {
    console.log('close modal');
    setAddWalletModal(false);
  };

  useEffect(() => {
    // add getting wallets list
  }, []);

  return (
    <div style={{display: "flex", justifyContent: "center"}}>
      <div style={{width: "750px"}}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Description</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.description}</TableCell>
                  <TableCell align="right">{row.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" onClick={openModal}>Add</Button>
      </div>
      <Dialog
        open={addWalletModal}
        onClose={closeModal}
      >
        <DialogTitle id="alert-dialog-title">
          Do you want to add new wallet?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Enter all the fields.
          </DialogContentText>
          <Stack spacing={2}>
            <TextField id="outlined-basic" label="Name" variant="outlined" />
            <TextField id="outlined-basic" label="Description" variant="outlined" />
            <TextField id="outlined-basic" label="Starting balance" variant="outlined" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Disagree</Button>
          <Button onClick={closeModal} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default WalletsList;