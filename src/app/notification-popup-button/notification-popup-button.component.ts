import {Component, ElementRef, HostListener, OnInit} from '@angular/core'
import {NotificationService} from '../notification.service'
import {Notification} from '../../models/notification'

@Component({
  selector: 'wn-notification-popup-button',
  templateUrl: './notification-popup-button.component.html',
  styleUrls: ['./notification-popup-button.component.css']
})
export class NotificationPopupButtonComponent implements OnInit {

  notifications: Notification[] = []
  showNotifications = false
  loadedAllNotifications = false
  latestIndexLoaded = 0

  numberOfUnreadNotifications: number

  constructor(private _notificationService: NotificationService,
              private el: ElementRef) {
  }

  ngOnInit() {
    const from = 0
    const to = 10
    this._notificationService.getLatestNotifications(from, to).subscribe(notifications => {
      this.notifications = notifications
      this.numberOfUnreadNotifications = this.notifications.filter(not => !not.read).length
      this.latestIndexLoaded = to
      this.loadedAllNotifications = notifications.length < to - from
    })

    this.subscribeToNewNotifications()
  }

  @HostListener('document:click', ['$event'])
  hideOnOutsideClick(event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showNotifications = false
    }
  }

  subscribeToNewNotifications() {
    this._notificationService.getContinuousNotifications().subscribe(newNotification => {
      this.numberOfUnreadNotifications++
      this.notifications = [newNotification].concat(this.notifications)
          this.latestIndexLoaded = this.notifications.length
      }
    )
  }

  loadMoreNotifications() {
    this._notificationService.getLatestNotifications(this.latestIndexLoaded, this.latestIndexLoaded + 5).subscribe(not => {
      this.latestIndexLoaded += 5
      this.notifications = this.notifications.concat(not)
      this.loadedAllNotifications = this.latestIndexLoaded > this.notifications.length
    })
  }

  toggleShowNotifications() {
    this.showNotifications = !this.showNotifications
    this.numberOfUnreadNotifications = 0
    this.notifications.forEach(notification => {
      if (!notification.read) {
        this._notificationService.readNotification(notification)
        if (!this.showNotifications) {
          notification.read = true
        }
      }
    })
  }

}
