"use strict";
const azure = require("@pulumi/azure-native");

/** 
    Create an Azure Resource Group
*/
const resourceGroup = new azure.resources.ResourceGroup("gp-pulumi-example-rg");

/**
    Create an Azure resource (Storage Account)
*/
const storageAccount = new azure.storage.StorageAccount("pulumiexamplesa", {
    resourceGroupName: resourceGroup.name,
    sku: {
        name: "Standard_LRS",
    },
    kind: "StorageV2",
    dependsOn: [
        resourceGroup
    ]
});


/** 
    Create an Azure Public IP
*/
const publicIPAddress = new azure.network.PublicIPAddress("pulumiExamplePublicIPAddress", {
    dnsSettings: {
        domainNameLabel: "pulumi-example-vm",
    },
    location: "eastus",
    publicIPAllocationMethod: "Dynamic",
    publicIpAddressName: "pulumiExampleIP",
    resourceGroupName: resourceGroup.name,
    sku: {
        name: "Basic",
    },
    dependsOn: [
        resourceGroup
    ]
});

/** 
    Create an Azure Security Group
*/
const networkSecurityGroup = new azure.network.NetworkSecurityGroup("pulumiExampleSecurityGroup", {
    location: "eastus",
    resourceGroupName: resourceGroup.name,
    securityRules: [{
        access: "Allow",
        destinationAddressPrefix: "*",
        destinationPortRange: "3389",
        direction: "Inbound",
        name: "default-allow-3389",
        priority: 1000,
        protocol: "Tcp",
        sourceAddressPrefix: "*",
        sourcePortRange: "*",
    }],
    dependsOn: [
        resourceGroup
    ]
});

/** 
    Create an Azure Virtual Network
*/

const virtualNetwork = new azure.network.VirtualNetwork("pulumiExampleNetwork", {
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    },
    location: "eastus",
    resourceGroupName: resourceGroup.name,
    subnets: [{
        addressPrefix: "10.0.0.0/24",
        name: "pulumiExampleSubnet",
        networkSecurityGroup: {
            id: networkSecurityGroup.id,
        },
    }],
}, {
    dependsOn: [networkSecurityGroup],
});

/** 
    Create an Azure Virtual Network Interface
*/

const networkInterface = new azure.network.NetworkInterface("pulumiExampleNetworkInterface", {
    ipConfigurations: [{
        name: "pulumiexampleipconfig",
        privateIPAllocationMethod: "Dynamic",
        publicIPAddress: {
            id: publicIPAddress.id,
        },
        subnet: {
            id: virtualNetwork.subnets[0].id,
        },
    }],
    location: "eastus",
    resourceGroupName: resourceGroup.name,
}, {
    dependsOn: [
        publicIPAddress,
        virtualNetwork,
    ],
});

/** 
    Create an Azure Virtual Machine
*/

const virtualMachine = new azure.compute.VirtualMachine("pulumiExampleVM", {
    diagnosticsProfile: {
        bootDiagnostics: {
            enabled: true,
            storageUri: storageAccount.storageUri,
        },
    },
    hardwareProfile: {
        vmSize: "Standard_D2s_v3",
    },
    location: "eastus",
    resourceGroupName: resourceGroup.name,
    networkProfile: {
        networkInterfaces: [{
            id: networkInterface.id,
        }],
    },
    osProfile: {
        adminPassword: "Password@1",
        adminUsername: "exampleadminuser",
        computerName: "pulumiExampleVM",
    },
    storageProfile: {
        dataDisks: [{
            createOption: "Empty",
            diskSizeGB: 1023,
            lun: 0,
        }],
        imageReference: {
            offer: "WindowsServer",
            publisher: "MicrosoftWindowsServer",
            sku: "2019-datacenter-gensecond",
            version: "latest",
        },
        osDisk: {
            createOption: "FromImage",
            managedDisk: {
                storageAccountType: "StandardSSD_LRS",
            },
        },
    },
}, {
    dependsOn: [
        networkInterface,
        storageAccount,
        resourceGroup
    ]
});