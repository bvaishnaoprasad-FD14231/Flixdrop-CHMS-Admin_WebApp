import { Component, OnDestroy, OnInit } from "@angular/core";
import { AuthService } from "src/app/services/auth/auth.service";
import { UserService } from "src/app/services/user/user.service";
import { Subscription } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { TranslateModule } from "@ngx-translate/core";
import { InputHandlerService } from "src/app/services/input-handler/input-handler.service";
import { SortTableService } from "src/app/services/sort-table/sort-table.service";

@Component({
  selector: "app-healths",
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslateModule],
  templateUrl: "./healths.component.html",
  styleUrls: ["./healths.component.scss"],
})
export class HealthsComponent implements OnInit, OnDestroy {

  private fetchUserDataSub: Subscription;
  private userDataSub: Subscription;
  private farmIdSubscription: Subscription;
  
  results: any[] = [];
  healthEvents: any[] = [];
  sortOrders = {};
  
  fromDate: string;
  toDate: string;
  maxDate: string;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private inputHandlerService: InputHandlerService,
    private sortHandlerService: SortTableService
  ) {}

  ngOnDestroy() {
    if (this.userDataSub) {
      this.userDataSub.unsubscribe();
    }
    if (this.fetchUserDataSub) {
      this.fetchUserDataSub.unsubscribe();
    }
    if (this.farmIdSubscription) {
      this.farmIdSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    let userId;
    this.isLoading = true;
    this.authService.authenticatedUser.subscribe((user) => {
      if (user) {
        userId = user["id"];
        this.isLoading = false;
      }
    });

    this.isLoading = true;
    if (!this.fetchUserDataSub) {
      this.fetchUserDataSub = this.userService
        .fetchOrganizationDocuments(userId)
        .subscribe((data) => {
          if (data) {
            this.isLoading = false;
          }
        });
    }
  }

  ngOnInit() {
    this.isLoading = true;
    if (!this.userDataSub) {
      this.userDataSub = this.userService.userData.subscribe((data) => {
        if (data) {
          this.healthEvents = data["healthEvents"];
          this.isLoading = false;
        }
      });
    }

    this.isLoading = true;
    if (!this.farmIdSubscription) {
      this.farmIdSubscription = this.userService.farmId$.subscribe((farmId) => {
        if (farmId) {
          console.log("Farm Id at Health Page :", farmId);
          this.healthEvents =
            farmId === "All Farms"
              ? this.healthEvents
              : this.healthEvents.filter(
                  (event) => event?.animal.farm.id === farmId
                );
          this.filterEvents();
          this.isLoading = false;
        }
      });
    }

    this.maxDate = new Date().toISOString().split("T")[0];
    this.toDate = new Date().toISOString();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.fromDate = thirtyDaysAgo.toISOString().split("T")[0];
    this.filterEvents();
  }

  filterEvents() {
    const from = new Date(this.fromDate).getTime();
    const to = new Date(this.toDate).getTime();
    this.results = this.healthEvents
      .filter((event) => {
        const startedAtTime = new Date(event?.detectedAt).getTime();
        return startedAtTime >= from && startedAtTime <= to;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
  }

  async handleInput(event: any) {
    this.isLoading = true;
    const value = event.detail.value;
    console.log("Value: ", value);
    if (value) {
      this.results = this.inputHandlerService.handleInput(
        value,
        this.healthEvents
      );
    } else if (value === "") {
      console.log("Else block executed");
    }
    this.isLoading = false;
  }

  sortTable(columnIndex: number): void {
    this.sortOrders = this.sortHandlerService.sortTable(
      columnIndex,
      "myTable",
      this.sortOrders
    );
  }
}
