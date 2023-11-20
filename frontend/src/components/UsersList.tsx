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
  {name: 'John', email: 'john.smith@gmail.com', age: 30},
  {name: 'Tom', email: 'tom.smith@gmail.com', age: 30},
  {name: 'Bruce', email: 'bruce.smith@gmail.com', age: 30},
];

const UsersList = () => {
  const [addUserModal, setAddUserModal] = useState(false);
  const openModal = () => {
    console.log('add new user');
    setAddUserModal(true);
  };

  const closeModal = () => {
    console.log('close modal');
    setAddUserModal(false);
  };

  useEffect(() => {
    // add getting users list
  }, []);

  return (
    <div style={{display: "flex", justifyContent: "center"}}>
      <div style={{width: "750px"}}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Email</TableCell>
                <TableCell align="right">Age</TableCell>
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
                  <TableCell align="right">{row.email}</TableCell>
                  <TableCell align="right">{row.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" onClick={openModal}>Add</Button>
      </div>
      <Dialog
        open={addUserModal}
        onClose={closeModal}
      >
        <DialogTitle id="alert-dialog-title">
          Do you want to add new user?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Enter all the fields.
          </DialogContentText>
          <Stack spacing={2}>
            <TextField id="outlined-basic" label="Name" variant="outlined" />
            <TextField id="outlined-basic" label="Family name" variant="outlined" />
            <TextField id="outlined-basic" label="Birthdate" variant="outlined" />
            <TextField id="outlined-basic" label="Password" variant="outlined" />
            <TextField id="outlined-basic" label="Email" variant="outlined" />
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
  );
}

export default UsersList;