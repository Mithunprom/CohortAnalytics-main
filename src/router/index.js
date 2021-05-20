import Vue from 'vue'
import VueRouter from 'vue-router'
import StudentListView from "../views/StudentListView";
import StudentView from "../views/StudentView";
import CohortView from "../views/CohortView";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'StudentListView',
    component: StudentListView
  },
  {
    path: '/student-view/:id',
    name: 'StudentView',
    component: StudentView,
  },
  {
    path: '/cohort-view',
    name: 'CohortView',
    component: CohortView
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
