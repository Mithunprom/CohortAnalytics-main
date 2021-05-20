<template>
    <div id="student-list">
        <b-table sticky-header responsive hover :items="allStudentBasicInfo" :fields="fields">
            <template #cell(_)="row">
                <router-link :to="{ name: 'StudentView', params: {id: row.item.studentID} }" >Detail</router-link>
            </template>
        </b-table>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
    name: "StudentList",
    computed: mapGetters(["allStudentBasicInfo"]),
    data() {
        return {
            fields: [
                { key: 'studentID', sortable: true },
                { key: 'firstName', sortable: true },
                { key: 'lastName', sortable: true },
                { key: '_', sortable: false }],
        }
    }    
}
</script>

<style scoped>

</style>