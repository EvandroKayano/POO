import { Bike } from "./bike";
import { Crypt } from "./crypt";
import { Rent } from "./rent";
import { User } from "./user";
import { Gps } from "./gps";
import crypto from 'crypto'
import { UserNotFoundError } from "../errors/user-not-found-error";
import { BikeNotFoundError } from "../errors/bike-not-found-error";
import { UnavailableBikeError } from "../errors/unavailable-bike-error";
import { DuplicatedUserError } from "../errors/duplicated-user-error";

export class App {
    users: User[] = []
    bikes: Bike[] = []
    rents: Rent[] = []
    crypt: Crypt = new Crypt()

    findUser(email: string): User {
        const user = this.users.find(x => x.email === email)
        if(!user) throw new UserNotFoundError()
        return user
    }


    async registerUser(user: User): Promise <string> {
    //push = insere no array
    //this.users.push(user), mas pode aderir 2x o mesmo então

    // .some é uma função booleano que procura ALGUMA variavel e retorna se tem ou não
    // .some passa uma função como parâmetro
    // ao usar .some, (há uma variavel qualquer, que é utilizada depois 
    //para se equiparar à uma condição)

        for (const rUser of this.users) {
            if (rUser.email === user.email) {
            // === compara o tipo da variavel, 'bit a bit'
                throw new DuplicatedUserError()
            }
        }
        
        const newId = crypto.randomUUID()
        user.id = newId
        const encryptedPassword = await this.crypt.encrypt(user.password)
        user.password = encryptedPassword
        this.users.push(user)
        return newId
    }


    async authenticate(userEmail: string, password: string): Promise <boolean> {
        const user = this.findUser(userEmail)
        return await this.crypt.compare(password, user.password)
    }


    registerBike(bike: Bike): string {
        const newId = crypto.randomUUID()
        bike.id = newId
        this.bikes.push(bike)
        return newId
    }


    removeUser(email: string): void {
        const userIndex = this.users.findIndex(user => user.email === email)
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1)
            return
        }
        else{
            throw new UserNotFoundError()
        }
    }
    

    rentBike(bikeId: string, userEmail: string): void {
        const bike = this.bikes.find(bike => bike.id === bikeId)
        if (!bike) { throw new BikeNotFoundError() }
        if (!bike.available) { throw new UnavailableBikeError() }
        const user = this.findUser(userEmail)
        bike.available = false
        const newRent = new Rent(bike, user, new Date())
        this.rents.push(newRent)
    }


    returnBike(bikeId: string, userEmail: string): number {
        const now = new Date()
        const rent = this.rents.find(rent =>
            rent.bike.id === bikeId &&
            rent.user.email === userEmail &&
            !rent.end
        )
        if (!rent) throw new Error('Rent not found.')
        rent.end = now
        rent.bike.available = true
        const hours = diffHours(rent.end, rent.start)
        return hours * rent.bike.rate
    }


    listUsers(): User[] {
        return this.users
    }

    listBikes(): Bike[] {
        return this.bikes
    }

    listRents(): Rent[] {
        return this.rents
    }


    moveBikeTo(bike_id:string,place:Gps): void{
        const bike = this.bikes.find(x => x.id === bike_id)
        if(!bike) throw new BikeNotFoundError()
        // velho: throw new Error ('Bike not registered or not found.')
        else{        
            bike.location.long = place.long
            bike.location.lati = place.lati
        }
    }


}



function diffHours(dt2: Date, dt1: Date) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return Math.abs(diff);
}

// '1' == 1 , TRUE
// '1' === 1, FALSE

// const array = [1,2,3,-1]
// array.some( item => { return item < 0 } )
// algum numero no array negativo
// retorna TRUE

// array.every( item => { return item < 0 } )
// retorna FALSE , 'every'  ->  todos tem que ser negativos